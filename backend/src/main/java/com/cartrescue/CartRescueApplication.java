package com.cartrescue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CartRescueApplication {

    public static void main(String[] args) {
        SpringApplication.run(CartRescueApplication.class, args);
        System.out.println("==================================================================");
        System.out.println("  Cart Rescue Backend API Gateway & Orchestrator Started!");
        System.out.println("  Track 2 · Cart Rescue — Abandonment Diagnosis & Remediation");
        System.out.println("==================================================================");
    }
}
